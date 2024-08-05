import * as v from 'valibot'

export const folderForm = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  color: v.pipe(v.string(), v.minLength(1)),
  parentFolderId: v.string(),
})
