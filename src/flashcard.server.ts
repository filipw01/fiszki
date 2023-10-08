import { db } from '~/db/db.server'
import { isNonEmptyString } from '~/utils.server'
import { deleteFromS3, s3Url } from '~/db/uploadHandler.server'

export const deleteFlashcard = async (id: string) => {
  const flashcard = await db.flashcard.delete({
    where: { id },
  })
  await Promise.all(
    [flashcard.backImage, flashcard.frontImage].map((image) => {
      if (isNonEmptyString(image) && image.startsWith(`${s3Url}/`)) {
        const key = image.replace(`${s3Url}/`, '')
        return deleteFromS3(key)
      }
    })
  )
  return flashcard
}
