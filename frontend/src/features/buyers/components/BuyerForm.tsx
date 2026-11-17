import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/core/components/Button';
import type { Buyer, CreateBuyerDto } from '../types';

interface BuyerFormProps {
  initialValues?: Partial<Buyer>;
  onSubmit: (data: CreateBuyerDto) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CROP_TYPES = ['Rice', 'Maize', 'Wheat', 'Tomato', 'Potato', 'Onion', 'Chili', 'Coconut', 'Tea', 'Rubber', 'Other'];

const BuyerForm: React.FC<BuyerFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBuyerDto>({
    defaultValues: {
      name: initialValues?.name ?? '',
      location: initialValues?.location ?? '',
      requiredCropType: initialValues?.requiredCropType ?? '',
      requiredQuantityKg: initialValues?.requiredQuantityKg ?? 0,
      maxPricePerKg: initialValues?.maxPricePerKg ?? 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="buyer-name">Buyer Name / Company *</label>
        <input
          id="buyer-name"
          className="form-input"
          type="text"
          placeholder="e.g. Fresh Mart Pvt Ltd"
          {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
        />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
      </div>

      {/* Location */}
      <div className="form-group">
        <label className="form-label" htmlFor="buyer-location">Location *</label>
        <input
          id="buyer-location"
          className="form-input"
          type="text"
          placeholder="e.g. Colombo"
          {...register('location', { required: 'Location is required' })}
        />
        {errors.location && <span className="form-error">{errors.location.message}</span>}
      </div>

      {/* Required Crop Type */}
      <div className="form-group">
        <label className="form-label" htmlFor="buyer-crop">Required Crop Type *</label>
        <select
          id="buyer-crop"
          className="form-select"
          {...register('requiredCropType', { required: 'Crop type is required' })}
        >
          <option value="">Select crop type...</option>
          {CROP_TYPES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.requiredCropType && <span className="form-error">{errors.requiredCropType.message}</span>}
      </div>

      {/* Required Quantity */}
      <div className="form-group">
        <label className="form-label" htmlFor="buyer-qty">Required Quantity (kg) *</label>
        <input
          id="buyer-qty"
          className="form-input"
          type="number"
          min={1}
          placeholder="e.g. 1000"
          {...register('requiredQuantityKg', {
            required: 'Quantity is required',
            min: { value: 1, message: 'Must be at least 1 kg' },
            valueAsNumber: true,
          })}
        />
        {errors.requiredQuantityKg && <span className="form-error">{errors.requiredQuantityKg.message}</span>}
      </div>

      {/* Max Price per kg */}
      <div className="form-group">
        <label className="form-label" htmlFor="buyer-price">Max Price per kg (LKR) *</label>
        <input
          id="buyer-price"
          className="form-input"
          type="number"
          min={0.01}
          step={0.01}
          placeholder="e.g. 100.00"
          {...register('maxPricePerKg', {
            required: 'Max price is required',
            min: { value: 0.01, message: 'Price must be positive' },
            valueAsNumber: true,
          })}
        />
        {errors.maxPricePerKg && <span className="form-error">{errors.maxPricePerKg.message}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
