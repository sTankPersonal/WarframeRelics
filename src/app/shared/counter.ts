import { Component, input, model } from '@angular/core';

/** A small "- 3 +" stepper. Use with [(value)] or [value] + (valueChange). */
@Component({
  selector: 'app-counter',
  template: `
    <button type="button" (click)="value.set(value() - 1)" [disabled]="value() <= 0"
            [attr.aria-label]="'Remove one ' + label()">−</button>
    <span class="value" [class.done]="target() && value() >= target()!">
      {{ value() }}@if (target()) {/{{ target() }}}
    </span>
    <button type="button" (click)="value.set(value() + 1)"
            [attr.aria-label]="'Add one ' + label()">+</button>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 0.25rem; }
    button { width: 1.6rem; height: 1.6rem; padding: 0; }
    .value { min-width: 2.5rem; text-align: center; font-variant-numeric: tabular-nums; }
    .done { color: var(--success); }
  `,
})
export class Counter {
  readonly value = model(0);
  /** Optional goal, shown as "owned/target". */
  readonly target = input<number>();
  /** Used for screen-reader labels. */
  readonly label = input('');
}
