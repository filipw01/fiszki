import { z } from 'zod'

export const folderForm = z.object({
  name: z.string().nonempty(),
  color: z.string().nonempty(),
  parentFolderId: z.string(),
})
