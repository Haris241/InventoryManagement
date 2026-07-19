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

export function openLoadingTab(title = 'Generating Report...', message = 'Please wait, your report is being prepared...'): Window | null {
  const newTab = window.open('', '_blank');
  if (newTab) {
    newTab.document.title = title;
    newTab.document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;
        font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#1a1a2e;color:#e0e0e0;">
        <div style="width:48px;height:48px;border:4px solid #333;border-top:4px solid #0ea5e9;
          border-radius:50%;animation:spin 1s linear infinite;margin-bottom:24px;"></div>
        <h2 style="margin:0 0 8px;font-weight:500;color:#f0f0f0;">${title}</h2>
        <p style="margin:0;color:#999;font-size:14px;">${message}</p>
        <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
      </div>
    `;
  }
  return newTab;
}

export function showBlobInTab(newTab: Window | null, blob: Blob, fileName: string): void {
  if (!newTab || newTab.closed) return;
  const namedBlob = new File([blob], fileName, { type: 'application/pdf' });
  const url = URL.createObjectURL(namedBlob);
  newTab.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}