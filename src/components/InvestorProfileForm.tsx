import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { InvestorProfile, InvestorProfileInput, Industry, Stage, KPI, RedFlag, Tone } from '@/types/investor';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  industries: z.array(z.string()).min(1, 'Select at least one industry'),
  stages: z.array(z.string()).min(1, 'Select at least one stage'),
  minInvestment: z.number().min(0, 'Minimum investment must be positive'),
  maxInvestment: z.number().min(0, 'Maximum investment must be positive'),
  kpis: z.array(z.string()).min(1, 'Select at least one KPI'),
  redFlags: z.array(z.string()).min(1, 'Select at least one red flag'),
  communicationTone: z.string(),
}).refine((data) => data.maxInvestment >= data.minInvestment, {
  message: "Maximum investment must be greater than or equal to minimum investment",
  path: ["maxInvestment"],
});

type FormData = z.infer<typeof formSchema>;

interface InvestorProfileFormProps {
  initialData?: InvestorProfile;
  onSubmit: (data: InvestorProfileInput) => void;
  onCancel: () => void;
}

const industryOptions = [
  { value: 'SaaS', label: 'SaaS' },
  { value: 'AI/ML', label: 'AI/ML' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Healthcare', label: 'Healthcare' },
];

const stageOptions = [
  { value: 'Seed', label: 'Seed' },
  { value: 'Series A', label: 'Series A' },
  { value: 'Series B', label: 'Series B' },
  { value: 'Series C', label: 'Series C' },
  { value: 'Growth', label: 'Growth' },
];

const kpiOptions = [
  { value: 'ARR', label: 'ARR' },
  { value: 'MRR', label: 'MRR' },
  { value: 'CAC', label: 'CAC' },
  { value: 'LTV', label: 'LTV' },
  { value: 'Churn Rate', label: 'Churn Rate' },
];

const redFlagOptions = [
  { value: 'High Burn Rate', label: 'High Burn Rate' },
  { value: 'High CAC', label: 'High CAC' },
  { value: 'Low Margins', label: 'Low Margins' },
  { value: 'Market Saturation', label: 'Market Saturation' },
];

const toneOptions = [
  { value: 'Formal', label: 'Formal' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Friendly', label: 'Friendly' },
];

export function InvestorProfileForm({ initialData, onSubmit, onCancel }: InvestorProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      industries: [],
      stages: [],
      minInvestment: 0,
      maxInvestment: 0,
      kpis: [],
      redFlags: [],
      communicationTone: 'Formal',
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...data,
        minInvestment: Number(data.minInvestment),
        maxInvestment: Number(data.maxInvestment),
        industries: data.industries as Industry[],
        stages: data.stages as Stage[],
        kpis: data.kpis as KPI[],
        redFlags: data.redFlags as RedFlag[],
        communicationTone: data.communicationTone as Tone,
      });
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industries</FormLabel>
              <FormControl>
                <MultiSelect
                  options={industryOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investment Stages</FormLabel>
              <FormControl>
                <MultiSelect
                  options={stageOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minInvestment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Investment</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxInvestment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Investment</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="kpis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>KPIs</FormLabel>
              <FormControl>
                <MultiSelect
                  options={kpiOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="redFlags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Red Flags</FormLabel>
              <FormControl>
                <MultiSelect
                  options={redFlagOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="communicationTone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Communication Tone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')} Profile
          </Button>
        </div>
      </form>
    </Form>
  );
} 