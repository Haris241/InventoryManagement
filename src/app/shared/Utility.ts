import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

//Enum Converter for Dropdowns
export function enumToOptions<T extends Record<string, string | number>>(enumObj: T, humanize = false): { name: string; value: number }[] {
  return Object.keys(enumObj)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      name: humanize ? key.replace(/([A-Z])/g, ' $1').trim() : key,
      value: enumObj[key] as number
    }));
}

const MyPreset = definePreset(Aura, {

  semantic: {

    primary: {
      50: '#e6f7f9',
      100: '#b3e9ee',
      200: '#80dbe3',
      300: '#4dcdd8',
      400: '#26c2d0',
      500: '#47c4cf',   // YOUR MAIN COLOR
      600: '#3aa5ad',
      700: '#2c858c',
      800: '#1f666b',
      900: '#12464a'
    },

    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.500}',
      offset: '1px'
    }
  },

  components: {

    inputtext: {
      colorScheme: {
        light: {
          root: {
            background: '#FFFFFF',
            borderColor: '#1a191962'
          }
        },
        dark: {
          root: {
            background: '#09090b',
            borderColor: '#FFFFFF29'
          }
        }
      }
    }

  },

  colorscheme: {

    light: {
      surface: {
        0: '#ffffff',
        50: '#F2F4F7'
      }
    },

    dark: {
      surface: {
        0: '#17171a',
        50: '#09090b'
      }
    }

  }

});

export default MyPreset;

export function toDateOnlyString(date: Date | null): string | null {

  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}