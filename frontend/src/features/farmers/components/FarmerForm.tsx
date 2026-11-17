import React from 'react';
import { useForm } from 'react-hook-form';
import type { CreateFarmerDto, Farmer } from '@contracts/types';
import Button from '@/core/components/Button';
import { DEMO_TODAY, PRODUCTS, QUALITY_GRADES, QUALITY_LABELS } from '@/shared/constants';

interface FarmerFormProps {
  initialValues?: Partial<Farmer>;
  locations: string[];
  onSubmit: (data: CreateFarmerDto) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const FarmerForm: React.FC<FarmerFormProps> = ({
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
  } = useForm<CreateFarmerDto>({
    defaultValues: {
      name: initialValues?.name ?? '',
      location: initialValues?.location ?? locations[0] ?? '',
      cropType: initialValues?.cropType ?? 'Tomato',
      quantityKg: initialValues?.quantityKg ?? 500,
      pricePerKg: initialValues?.pricePerKg ?? 100,
      minPricePerKg:
        initialValues?.minPricePerKg ?? Math.round((initialValues?.pricePerKg ?? 100) * 0.85),
      qualityGrade: initialValues?.qualityGrade ?? 'B',
      availableFrom: initialValues?.availableFrom ?? DEMO_TODAY,
    },
  });

  const pricePerKg = watch('pricePerKg');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="farmer-name">
            Full name *
          </label>
          <input
            id="farmer-name"
            className="form-input"
            type="text"
            autoComplete="name"
            placeholder="e.g. Sunil Perera"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'At least 2 characters' },
            })}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="farmer-location">
            Town *
          </label>
          <select
            id="farmer-location"
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
          <label className="form-label" htmlFor="farmer-crop">
            Crop *
          </label>
          <select
            id="farmer-crop"
            className="form-select"
            {...register('cropType', { required: 'Crop type is required' })}
          >
            {PRODUCTS.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
          {errors.cropType && <span className="form-error">{errors.cropType.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="farmer-quality">
            Quality grade
          </label>
          <select id="farmer-quality" className="form-select" {...register('qualityGrade')}>
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
          <label className="form-label" htmlFor="farmer-qty">
            Available quantity (kg) *
          </label>
          <input
            id="farmer-qty"
            className="form-input"
            type="number"
            min={1}
            step={1}
            {...register('quantityKg', {
              required: 'Quantity is required',
              min: { value: 1, message: 'Must be at least 1 kg' },
              valueAsNumber: true,
            })}
          />
          {errors.quantityKg && <span className="form-error">{errors.quantityKg.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="farmer-available">
            Available from
          </label>
          <input
            id="farmer-available"
            className="form-input"
            type="date"
            {...register('availableFrom', { required: 'Availability date is required' })}
          />
          {errors.availableFrom && <span className="form-error">{errors.availableFrom.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="farmer-price">
            Asking price (Rs/kg) *
          </label>
          <input
            id="farmer-price"
            className="form-input"
            type="number"
            min={0.01}
            step={0.01}
            {...register('pricePerKg', {
              required: 'Price is required',
              min: { value: 0.01, message: 'Price must be positive' },
              valueAsNumber: true,
            })}
          />
          {errors.pricePerKg && <span className="form-error">{errors.pricePerKg.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="farmer-min-price">
            Minimum acceptable (Rs/kg)
          </label>
          <input
            id="farmer-min-price"
            className="form-input"
            type="number"
            min={0.01}
            step={0.01}
            {...register('minPricePerKg', {
              valueAsNumber: true,
              validate: (value) =>
                value === undefined ||
                Number.isNaN(value) ||
                value <= pricePerKg ||
                'Minimum price cannot exceed the asking price',
            })}
          />
          {errors.minPricePerKg && (
            <span className="form-error">{errors.minPricePerKg.message}</span>
          )}
          <span className="form-help">Defaults to 85% of the asking price.</span>
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {initialValues?.id ? 'Update Farmer' : 'Add Farmer'}
        </Button>
      </div>
    </form>
  );
};

export default FarmerForm;
