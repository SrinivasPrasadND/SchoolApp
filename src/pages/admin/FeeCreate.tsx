import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { TextField, TextAreaField, SelectField } from '@/components/forms/Fields';
import { feeStructureSchema, type FeeStructureFormValues } from '@/schemas';
import { useCreateFeeStructureMutation, useGetClassesQuery } from '@/services/api/endpoints';
import {
  ACADEMIC_YEARS,
  CURRENT_ACADEMIC_YEAR,
  FEE_CATEGORY_LABELS,
  TERMS,
} from '@/constants';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';
import { useState } from 'react';

export function FeeCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: classes = [] } = useGetClassesQuery();
  const [createFee, { isLoading }] = useCreateFeeStructureMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FeeStructureFormValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      category: 'tuition',
      academicYear: CURRENT_ACADEMIC_YEAR,
      term: TERMS[0],
      classId: 'all',
      section: 'all',
      description: '',
    },
  });

  const selectedClassId = watch('classId');
  const sectionOptions =
    selectedClassId === 'all'
      ? [{ value: 'all', label: 'All Sections' }]
      : [
          { value: 'all', label: 'All Sections' },
          ...(classes.find((c) => c.id === selectedClassId)?.sections ?? []).map((s) => ({
            value: s,
            label: `Section ${s}`,
          })),
        ];

  const onSubmit = async (values: FeeStructureFormValues) => {
    setFormError(null);
    try {
      const fee = await createFee(values).unwrap();
      toast(`Fee "${fee.name}" created and assigned to students.`, 'success');
      navigate(`/admin/fees/${fee.id}`);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setFormError(message);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, msg]) =>
          setError(field as keyof FeeStructureFormValues, { message: msg }),
        );
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate('/admin/fees')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to fees
      </button>
      <PageHeader title="Create Fee Structure" description="Define a fee and assign it to students" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 p-5">
        {formError && (
          <div role="alert" className="rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            {formError}
          </div>
        )}

        <TextField label="Fee Name" required error={errors.name?.message} {...register('name')} />

        <TextAreaField
          label="Description"
          hint="Optional details shown to parents"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Category"
            required
            error={errors.category?.message}
            options={Object.entries(FEE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
            {...register('category')}
          />
          <TextField
            label="Amount"
            type="number"
            min={0}
            step={1}
            required
            error={errors.amount?.message}
            {...register('amount')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Due Date" type="date" required error={errors.dueDate?.message} {...register('dueDate')} />
          <TextField
            label="Late Fee / Day"
            type="number"
            min={0}
            hint="Optional"
            error={errors.lateFeePerDay?.message}
            {...register('lateFeePerDay')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Academic Year"
            required
            error={errors.academicYear?.message}
            options={ACADEMIC_YEARS.map((y) => ({ value: y, label: y }))}
            {...register('academicYear')}
          />
          <SelectField
            label="Term"
            required
            error={errors.term?.message}
            options={TERMS.map((t) => ({ value: t, label: t }))}
            {...register('term')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Assign to Class"
            required
            error={errors.classId?.message}
            options={[{ value: 'all', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            {...register('classId')}
          />
          <SelectField
            label="Section"
            required
            error={errors.section?.message}
            options={sectionOptions}
            {...register('section')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/fees')}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Create Fee
          </Button>
        </div>
      </form>
    </div>
  );
}
