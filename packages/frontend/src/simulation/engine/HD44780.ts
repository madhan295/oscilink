export class HD44780 {
  public rows: string[] = ['                ', '                '];
  public cursorRow: number = 0;
  public cursorCol: number = 0;
  public backlight: boolean = false;
  
  // internal state
  public is4BitMode: boolean = false;
  public halfNibble: number | null = null;
  public lastEnable: boolean = false;

  // DDRAM mapped as 1D array of 80 chars, but only some are visible
  public ddram: Uint8Array = new Uint8Array(80); 
  // CGRAM mapped as 64 bytes
  public cgram: Uint8Array = new Uint8Array(64);
  
  public cgramAddress: number = 0;
  public ddramAddress: number = 0;
  public addressCounterIsCgram: boolean = false;

  public displayOn: boolean = false;
  public cursorOn: boolean = false;
  public blinkOn: boolean = false;
  public increment: boolean = true;
  public shiftDisplay: boolean = false;

  constructor() {
    this.ddram.fill(0x20); // fill with spaces
    this.updateRows();
  }

  public processPins(rs: boolean, rw: boolean, e: boolean, dataNibble: number, backlight: boolean) {
    this.backlight = backlight;

    if (!this.lastEnable && e) {
      // Rising edge - nothing to do, HD44780 reads on falling edge
    }

    if (this.lastEnable && !e) {
      // Falling edge
      if (rw) {
        // Read mode - ignoring for simulation since LiquidCrystal usually only writes
      } else {
        // Write mode
        if (!this.is4BitMode) {
          // 8-bit mode (but we only get 4 bits connected to D4-D7)
          // The data sent is on D4-D7, so the byte is dataNibble << 4
          this.executeWrite(rs, dataNibble << 4); 
        } else {
          // 4-bit mode
          if (this.halfNibble === null) {
            this.halfNibble = dataNibble; // save high nibble
          } else {
            const byte = (this.halfNibble << 4) | dataNibble;
            this.halfNibble = null;
            this.executeWrite(rs, byte);
          }
        }
      }
    }
    this.lastEnable = e;
  }

  private executeWrite(rs: boolean, byte: number) {
    if (rs) {
      this.writeData(byte);
    } else {
      this.writeCommand(byte);
    }
    this.updateRows();
  }

  private writeCommand(cmd: number) {
    if (cmd === 0x01) { // Clear display
      this.ddram.fill(0x20);
      this.ddramAddress = 0;
      this.increment = true;
    } else if (cmd === 0x02 || cmd === 0x03) { // Return home
      this.ddramAddress = 0;
    } else if ((cmd & 0xFC) === 0x04) { // Entry mode set
      this.increment = (cmd & 0x02) !== 0;
      this.shiftDisplay = (cmd & 0x01) !== 0;
    } else if ((cmd & 0xF8) === 0x08) { // Display on/off
      this.displayOn = (cmd & 0x04) !== 0;
      this.cursorOn = (cmd & 0x02) !== 0;
      this.blinkOn = (cmd & 0x01) !== 0;
    } else if ((cmd & 0xF0) === 0x10) { // Cursor/Display shift
      // ignore for simplicity
    } else if ((cmd & 0xE0) === 0x20) { // Function set
      if ((cmd & 0x10) === 0) {
        this.is4BitMode = true;
      } else {
        this.is4BitMode = false;
        this.halfNibble = null; // Reset 4-bit state
      }
    } else if ((cmd & 0xC0) === 0x40) { // Set CGRAM address
      this.cgramAddress = cmd & 0x3F;
      this.addressCounterIsCgram = true;
    } else if ((cmd & 0x80) === 0x80) { // Set DDRAM address
      this.ddramAddress = cmd & 0x7F;
      this.addressCounterIsCgram = false;
    }
  }

  private writeData(data: number) {
    if (this.addressCounterIsCgram) {
      this.cgram[this.cgramAddress] = data;
      this.cgramAddress = (this.cgramAddress + 1) & 0x3F;
    } else {
      this.ddram[this.ddramAddress] = data;
      if (this.increment) {
        this.ddramAddress = (this.ddramAddress + 1) & 0x7F;
      } else {
        this.ddramAddress = (this.ddramAddress - 1) & 0x7F;
      }
    }
  }

  private updateRows() {
    // DDRAM address 0x00 to 0x0F is first row, 0x40 to 0x4F is second row
    let row1 = '';
    let row2 = '';
    for (let i = 0; i < 16; i++) {
      row1 += String.fromCharCode(this.ddram[0x00 + i] || 0x20);
      row2 += String.fromCharCode(this.ddram[0x40 + i] || 0x20);
    }
    this.rows = [row1, row2];

    if (this.ddramAddress >= 0x40) {
      this.cursorRow = 1;
      this.cursorCol = this.ddramAddress - 0x40;
    } else {
      this.cursorRow = 0;
      this.cursorCol = this.ddramAddress;
    }
  }
}
