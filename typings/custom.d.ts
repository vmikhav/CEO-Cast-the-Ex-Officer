import { Monetization } from '../src/scripts/models';

declare global {
  interface Document {
    monetization?: Monetization
  }
}
