import * as z from 'zod';

export const seasonSchema = z.object({
  name: z.string().min(1, 'Tên mùa vụ là bắt buộc'),
  code: z.string().min(1, 'Mã mùa vụ là bắt buộc'),
  year: z.number().min(2000, 'Năm phải từ 2000 trở lên'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type SeasonFormData = z.infer<typeof seasonSchema>;

export const defaultSeasonValues: SeasonFormData = {
  name: '',
  code: '',
  year: new Date().getFullYear(),
  start_date: '',
  end_date: '',
  description: '',
  is_active: true,
};
