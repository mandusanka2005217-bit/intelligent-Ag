import { Router } from 'express';
import multer from 'multer';
import type { CsvRowError, CsvUploadResult, ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { AppError, ValidationError } from '../errors';
import { csvToRecords } from '../utils/csv';
import { buyerCreateSchema, farmerCreateSchema } from './schemas';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

function numberValue(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function pick(record: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== '') return record[key];
  }
  return undefined;
}

function toFarmerInput(record: Record<string, string>) {
  return {
    name: pick(record, 'name', 'farmer_name'),
    location: pick(record, 'location', 'town'),
    cropType: pick(record, 'cropType', 'crop_type', 'product'),
    quantityKg: numberValue(pick(record, 'quantityKg', 'quantity_kg', 'quantity')),
    pricePerKg: numberValue(pick(record, 'pricePerKg', 'price_per_kg', 'price', 'asking_price')),
    minPricePerKg: numberValue(pick(record, 'minPricePerKg', 'min_price_per_kg')),
    qualityGrade: pick(record, 'qualityGrade', 'quality_grade', 'grade'),
    availableFrom: pick(record, 'availableFrom', 'available_from'),
  };
}

function toBuyerInput(record: Record<string, string>) {
  return {
    name: pick(record, 'name', 'buyer_name'),
    location: pick(record, 'location', 'town'),
    requiredCropType: pick(record, 'requiredCropType', 'required_crop_type', 'product'),
    requiredQuantityKg: numberValue(
      pick(record, 'requiredQuantityKg', 'required_quantity_kg', 'required_quantity'),
    ),
    maxPricePerKg: numberValue(pick(record, 'maxPricePerKg', 'max_price_per_kg', 'max_price')),
    minAcceptableQuantityKg: numberValue(
      pick(record, 'minAcceptableQuantityKg', 'min_acceptable_quantity_kg', 'min_lot'),
    ),
    minQualityGrade: pick(record, 'minQualityGrade', 'min_quality_grade'),
    requiredFrom: pick(record, 'requiredFrom', 'required_from'),
  };
}

export function createUploadRouter(store: DataStore): Router {
  const router = Router();

  router.post('/', upload.single('file'), (req, res) => {
    const type = (req.body?.type ?? req.query.type ?? 'farmer') as 'farmer' | 'buyer';
    if (type !== 'farmer' && type !== 'buyer') {
      throw new ValidationError('Upload type must be "farmer" or "buyer"');
    }
    if (!req.file) throw new ValidationError('CSV file is required in the "file" field');

    const scenarioId: ScenarioId = (req.body?.scenarioId ?? req.query.scenarioId ?? 'A') as ScenarioId;
    const text = req.file.buffer.toString('utf8');
    const records = csvToRecords(text);
    const errors: CsvRowError[] = [];
    let inserted = 0;

    records.forEach((record, index) => {
      const row = index + 2; // 1-based plus header
      const schema = type === 'farmer' ? farmerCreateSchema : buyerCreateSchema;
      const input = type === 'farmer' ? toFarmerInput(record) : toBuyerInput(record);
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            row,
            field: issue.path.join('.') || '(row)',
            message: issue.message,
            value: String(issue.path.reduce<unknown>((value, key) => (value as Record<string, unknown>)?.[String(key)], input) ?? ''),
          });
        }
        return;
      }

      try {
        if (type === 'farmer') {
          const { scenarioId: _ignored, ...dto } = parsed.data as typeof parsed.data & { scenarioId?: ScenarioId };
          store.addFarmer(scenarioId, dto as import('@contracts/types').CreateFarmerDto);
        } else {
          const { scenarioId: _ignored, ...dto } = parsed.data as typeof parsed.data & { scenarioId?: ScenarioId };
          store.addBuyer(scenarioId, dto as import('@contracts/types').CreateBuyerDto);
        }
        inserted += 1;
      } catch (error) {
        const message = error instanceof AppError ? error.message : 'Could not insert row';
        errors.push({ row, field: '(row)', message });
      }
    });

    const result: CsvUploadResult = { type, inserted, errors, totalRows: records.length };
    res.status(errors.length > 0 && inserted === 0 ? 422 : 200).json(result);
  });

  return router;
}
