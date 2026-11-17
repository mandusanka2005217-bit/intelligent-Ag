import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/core/components/Button';
import type { Farmer, CreateFarmerDto } from '../types';

interface FarmerFormProps {
  initialValues?: Partial<Farmer>;
  onSubmit: (data: CreateFarmerDto) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CROP_TYPES = ['Rice', 'Maize', 'Wheat', 'Tomato', 'Potato', 'Onion', 'Chili', 'Coconut', 'Tea', 'Rubber', 'Other'];

const FarmerForm: React.FC<FarmerFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFarmerDto>({
    defaultValues: {
      name: initialValues?.name ?? '',
      location: initialValues?.location ?? '',
      cropType: initialValues?.cropType ?? '',
      quantityKg: initialValues?.quantityKg ?? 0,
      pricePerKg: initialValues?.pricePerKg ?? 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="farmer-name">Full Name *</label>
        <input
          id="farmer-name"
          className="form-input"
          type="text"
          placeholder="e.g. Sunil Perera"
          {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
        />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
      </div>

      {/* Location */}
      <div className="form-group">
        <label className="form-label" htmlFor="farmer-location">Location *</label>
        <input
          id="farmer-location"
          className="form-input"
          type="text"
          placeholder="e.g. Kurunegala"
          {...register('location', { required: 'Location is required' })}
        />
        {errors.location && <span className="form-error">{errors.location.message}</span>}
      </div>

      {/* Crop Type */}
      <div className="form-group">
        <label className="form-label" htmlFor="farmer-crop">Crop Type *</label>
        <select
          id="farmer-crop"
          className="form-select"
          {...register('cropType', { required: 'Crop type is required' })}
        >
          <option value="">Select crop type...</option>
          {CROP_TYPES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.cropType && <span className="form-error">{errors.cropType.message}</span>}
      </div>

      {/* Quantity */}
      <div className="form-group">
        <label className="form-label" htmlFor="farmer-qty">Available Quantity (kg) *</label>
        <input
          id="farmer-qty"
          className="form-input"
          type="number"
          min={1}
          placeholder="e.g. 500"
          {...register('quantityKg', {
            required: 'Quantity is required',
            min: { value: 1, message: 'Must be at least 1 kg' },
            valueAsNumber: true,
          })}
        />
        {errors.quantityKg && <span className="form-error">{errors.quantityKg.message}</span>}
      </div>

      {/* Price per kg */}
      <div className="form-group">
        <label className="form-label" htmlFor="farmer-price">Price per kg (LKR) *</label>
        <input
          id="farmer-price"
          className="form-input"
          type="number"
          min={0.01}
          step={0.01}
          placeholder="e.g. 85.00"
          {...register('pricePerKg', {
            required: 'Price is required',
            min: { value: 0.01, message: 'Price must be positive' },
            valueAsNumber: true,
          })}
        />
        {errors.pricePerKg && <span className="form-error">{errors.pricePerKg.message}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
