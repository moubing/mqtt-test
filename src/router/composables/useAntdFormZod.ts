import z from 'zod'

export const testSchema = z.object({
  name: z.string().min(2, '最少输入2个字符').max(10, '最多输入10个字符'),
  age: z.coerce.number().gte(3),
})
