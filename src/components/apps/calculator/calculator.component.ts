
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  display = signal('0');
  private currentVal = '0';
  private operator: string | null = null;
  private firstOperand: number | null = null;
  private waitingForSecondOperand = false;

  onKeyPress(key: string) {
    if (/\d/.test(key)) {
      this.inputDigit(key);
    } else if (key === '.') {
      this.inputDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      this.setOperator(key);
    } else if (key === '=') {
      this.calculate();
    } else if (key === 'AC') {
      this.clear();
    } else if (key === '%') {
      this.inputPercent();
    } else if (key === '+/-') {
      this.toggleSign();
    }
  }

  private inputDigit(digit: string) {
    if (this.waitingForSecondOperand) {
      this.currentVal = digit;
      this.waitingForSecondOperand = false;
    } else {
      this.currentVal = this.currentVal === '0' ? digit : this.currentVal + digit;
    }
    this.display.set(this.currentVal);
  }

  private inputDecimal() {
    if (!this.currentVal.includes('.')) {
      this.currentVal += '.';
    }
    this.display.set(this.currentVal);
  }

  private setOperator(op: string) {
    if (this.firstOperand === null) {
      this.firstOperand = parseFloat(this.currentVal);
    } else if (this.operator) {
      this.calculate();
    }
    this.operator = op;
    this.waitingForSecondOperand = true;
  }

  private calculate() {
    if (this.operator && this.firstOperand !== null) {
      const secondOperand = parseFloat(this.currentVal);
      let result = 0;
      if (this.operator === '+') result = this.firstOperand + secondOperand;
      else if (this.operator === '-') result = this.firstOperand - secondOperand;
      else if (this.operator === '*') result = this.firstOperand * secondOperand;
      else if (this.operator === '/') result = this.firstOperand / secondOperand;

      this.currentVal = String(result);
      this.display.set(this.currentVal);
      this.firstOperand = result;
      this.operator = null;
      this.waitingForSecondOperand = false;
    }
  }
  
  private clear() {
    this.currentVal = '0';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.display.set('0');
  }

  private inputPercent() {
    this.currentVal = String(parseFloat(this.currentVal) / 100);
    this.display.set(this.currentVal);
  }

  private toggleSign() {
    this.currentVal = String(parseFloat(this.currentVal) * -1);
    this.display.set(this.currentVal);
  }
}
