

export interface Flashcard {
  id: string
  front: string
  frontImage?: string | null
  frontDescription?: string | null
  frontLanguage: string
  back: string
  backImage?: string | null
  backDescription?: string | null
  backLanguage: string
  folder: { id: string; path: string }
  tags: Tag[]
  randomSideAllowed: boolean
  streak: number
  nextStudy: string
  lastSeen: number
}

export interface Tag {
  id: string
  name: string
  color: {
    r: number
    g: number
    b: number
  }
}

const getTags = async (): Promise<Tag[]> => {
  return []
}

const getFlashcards = async (): Promise<Flashcard[]> => {
  return []
}


export const indexLoader = async () => {
  const [flashcards, tags] = await Promise.all([
    getFlashcards(),
    getTags(),
  ])

  return { flashcards, tags }
}



export const isNonEmptyString = (input: unknown): input is string =>
  typeof input === 'string' && input.length > 0

export const parseForm = (form: FormData) => {
  const data: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {}
  for (const [key, value] of form.entries()) {
    if (!data[key]) {
      data[key] = value
    } else {
      const dataValue = data[key]
      if (Array.isArray(dataValue)) {
        dataValue.push(value)
      } else {
        data[key] = [dataValue, value]
      }
    }
  }
  return data
}
