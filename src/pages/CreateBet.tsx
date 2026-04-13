import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBetSchema } from '../types/schemas';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import type { z } from 'zod';
import type { BetRecord } from '../types';

type FormValues = z.infer<typeof createBetSchema>;

export default function CreateBet() {
  const navigate = useNavigate();
  const { apiFetch } = useApi();
  const toast = useToast();
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createBetSchema),
    defaultValues: {
      description: '',
      minimumBet: 10,
      options: [{ label: '' }, { label: '' }] as unknown as string[],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' as never });

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    try {
      const result = await apiFetch<{ bet: BetRecord }>('/api/bets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast('Bet created!');
      navigate(`/bet/${result.bet.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create bet');
    }
  };

  return (
    <div style={{ maxWidth: '580px' }}>
      <h1
        className="font-display text-gold"
        style={{ margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 900 }}
      >
        Create a Bet
      </h1>
      <p className="text-muted" style={{ margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
        Set the terms. Let the shekels flow.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            {...register('description')}
            className={`input${errors.description ? ' error' : ''}`}
            placeholder="What are we betting on? e.g. Who scores first in the match"
            rows={3}
            style={{ resize: 'vertical' }}
          />
          {errors.description && (
            <p className="form-error">{errors.description.message}</p>
          )}
        </div>

        <div className="form-group" style={{ maxWidth: '200px' }}>
          <label className="form-label">Minimum Bet (₪)</label>
          <input
            {...register('minimumBet', { valueAsNumber: true })}
            type="number"
            min={1}
            className={`input${errors.minimumBet ? ' error' : ''}`}
            placeholder="10"
          />
          {errors.minimumBet && (
            <p className="form-error">{errors.minimumBet.message}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Options (2–8)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fields.map((field, index) => (
              <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  {...register(`options.${index}` as const)}
                  className={`input${
                    errors.options?.[index] ? ' error' : ''
                  }`}
                  placeholder={`Option ${index + 1}`}
                />
                {fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="btn btn-danger btn-sm"
                    style={{ flexShrink: 0, padding: '0.4rem 0.7rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {errors.options && typeof errors.options.message === 'string' && (
              <p className="form-error">{errors.options.message}</p>
            )}
          </div>
          {fields.length < 8 && (
            <button
              type="button"
              onClick={() => append('' as unknown as never)}
              className="btn btn-outline btn-sm"
              style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
            >
              + Add Option
            </button>
          )}
        </div>

        {serverError && (
          <p
            className="form-error"
            style={{
              background: 'rgba(255,87,87,0.1)',
              border: '1px solid rgba(255,87,87,0.3)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
            }}
          >
            {serverError}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-gold" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Bet'}
          </button>
        </div>
      </form>
    </div>
  );
}
