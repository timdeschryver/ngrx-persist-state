export class MockStorage implements Storage {
  public length: number;
  public clear(): void {}
  public getItem(key: string): string | null {
    return this[key] ? this[key] : null;
  }
  key(index: number): string | null {
    return '';
  }
  removeItem(key: string): void {
    this[key] = undefined;
  }
  setItem(key: string, data: string): void {
    this[key] = data;
  }
  [key: string]: any;
  [index: number]: string;
}
