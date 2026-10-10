declare module 'mammoth' {
  interface ExtractResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface Input {
    buffer?: Buffer;
    path?: string;
  }

  interface Mammoth {
    extractRawText(input: Input): Promise<ExtractResult>;
  }

  const mammoth: Mammoth;
  export default mammoth;
}