import React from 'react';
import { useForm } from 'react-hook-form';
import type { Buyer, CreateBuyerDto } from '@contracts/types';
import Button from '@/core/components/Button';
import { DEMO_TODAY, PRODUCTS, QUALITY_GRADES, QUALITY_LABELS } from '@/shared/constants';

interface BuyerFormProps {
  initialValues?: Partial<Buyer>;
  locations: string[];
  onSubmit: (data: CreateBuyerDto) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const BuyerForm: React.FC<BuyerFormProps> = ({
  initialValues,
  locations,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateBuyerDto>({
    defaultValues: {
      name: initialValues?.name ?? '',
      location: initialValues?.location ?? locations[0] ?? '',
      requiredCropType: initialValues?.requiredCropType ?? 'Tomato',
      requiredQuantityKg: initialValues?.requiredQuantityKg ?? 1000,
      maxPricePerKg: initialValues?.maxPricePerKg ?? 130,
      minAcceptableQuantityKg:
        initialValues?.minAcceptableQuantityKg ??
        Math.max(1, Math.round((initialValues?.requiredQuantityKg ?? 1000) * 0.1)),
      minQualityGrade: initialValues?.minQualityGrade ?? 'B',
      requiredFrom: initialValues?.requiredFrom ?? DEMO_TODAY,
    },
  });

  const requiredQuantityKg = watch('requiredQuantityKg');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="buyer-name">
            Buyer / company *
          </label>
          <input
            id="buyer-name"
            className="form-input"
            type="text"
            placeholder="e.g. Colombo Fresh Mart"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'At least 2 characters' },
            })}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="buyer-location">
            Town *
          </label>
          <select
            id="buyer-location"
            className="form-select"
            {...register('location', { required: 'Location is required' })}
          >
            <option value="">Select town…</option>
            {locations.map((town) => (
              <option key={town} value={town}>
                {town}
              </option>
            ))}
          </select>
          {errors.location && <span className="form-error">{errors.location.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="buyer-crop">
            Required crop *
          </label>
          <select
            id="buyer-crop"
            className="form-select"
            {...register('requiredCropType', { required: 'Crop type is required' })}
          >
            {PRODUCTS.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
          {errors.requiredCropType && (
            <span className="form-error">{errors.requiredCropType.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="buyer-quality">
            Minimum quality grade
          </label>
          <select id="buyer-quality" className="form-select" {...register('minQualityGrade')}>
            {QUALITY_GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {QUALITY_LABELS[grade]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="buyer-qty">
            Required quantity (kg) *
          </label>
          <input
            id="buyer-qty"
            className="form-input"
            type="number"
            min={1}
            step={1}
            {...register('requiredQuantityKg', {
              required: 'Quantity is required',
              min: { value: 1, message: 'Must be at least 1 kg' },
              valueAsNumber: true,
            })}
          />
          {errors.requiredQuantityKg && (
            <span className="form-error">{errors.requiredQuantityKg.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="buyer-min-lot">
            Minimum acceptable lot (kg)
          </label>
          <input
            id="buyer-min-lot"
            className="form-input"
            type="number"
            min={1}
            step={1}
            {...register('minAcceptableQuantityKg', {
              valueAsNumber: true,
              validate: (value) =>
                value === undefined ||
                Number.isNaN(value) ||
                value <= requiredQuantityKg ||
                'Minimum lot cannot exceed required quantity',
            })}
          />
          {errors.minAcceptableQuantityKg && (
            <span className="form-error">{errors.minAcceptableQuantityKg.message}</span>
          )}
          <span className="form-help">Defaults to 10% of the required quantity.</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="buyer-price">
            Maximum price (Rs/kg) *
          </label>
          <input
            id="buyer-price"
            className="form-input"
            type="number"
            min={0.01}
            step={0.01}
            {...register('maxPricePerKg', {
              required: 'Max price is required',
              min: { value: 0.01, message: 'Price must be positive' },
              valueAsNumber: true,
            })}
          />
          {errors.maxPricePerKg && (
            <span className="form-error">{errors.maxPricePerKg.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="buyer-required-from">
            Required from
          </label>
          <input
            id="buyer-required-from"
            className="form-input"
            type="date"
            {...register('requiredFrom', { required: 'Required date is required' })}
          />
          {errors.requiredFrom && <span className="form-error">{errors.requiredFrom.message}</span>}
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {initialValues?.id ? 'Update Buyer' : 'Add Buyer'}
        </Button>
      </div>
    </form>
  );
};

export default BuyerForm;
