
import { PDFParse } from 'pdf-parse'

export const extractTextFromPDF = async (
  fileBuffer: Buffer,
): Promise<string> => {
  let parser: PDFParse | null = null

  try {
    parser = new PDFParse({
      data: fileBuffer,
    })

    const result = await parser.getText()

    const text = result.text
      .replace(/\u0000/g, '')
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    console.log(
      '\n========== EXTRACTED RESUME TEXT ==========\n',
    )

    console.log(text)

    console.log(
      '\n========== END EXTRACTED RESUME TEXT ==========\n',
    )

    return text
  } catch (error) {
    console.error(
      'PDF text extraction error:',
      error,
    )

    throw new Error(
      'Failed to extract text from PDF',
    )
  } finally {
    if (parser) {
      await parser.destroy()
    }
  }
}
