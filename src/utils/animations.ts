import { useEffect, useRef } from 'react';

interface SplitTextOptions {
  type?: 'chars' | 'words';
  stagger?: number;
  duration?: number;
  y?: number;
}

interface SplitTextObserverEntry {
  observer: IntersectionObserver;
  element: HTMLElement;
}

const CJK_REGEX = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u3000-\u303F\uFF00-\uFFEF]/;

function isCJK(char: string): boolean {
  return CJK_REGEX.test(char);
}

function splitWords(text: string): string[] {
  const words: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === ' ' || char === '\n' || char === '\t') {
      if (current.length > 0) {
        words.push(current);
        current = '';
      }
      words.push(char);
    } else if (isCJK(char)) {
      if (current.length > 0) {
        words.push(current);
        current = '';
      }
      words.push(char);
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    words.push(current);
  }

  return words;
}

export function splitTextElement(el: HTMLElement, type: 'chars' | 'words'): void {
  const spanClass = type === 'chars' ? 'split-char' : 'split-word';
  let splitIndex = 0;

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (text.length === 0) return;

      const fragment = document.createDocumentFragment();

      if (type === 'chars') {
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === ' ' || char === '\n' || char === '\t') {
            fragment.appendChild(document.createTextNode(char));
          } else {
            const span = document.createElement('span');
            span.className = spanClass;
            span.style.setProperty('--split-index', String(splitIndex++));
            span.textContent = char;
            fragment.appendChild(span);
          }
        }
      } else {
        const words = splitWords(text);
        for (const word of words) {
          if (word === ' ' || word === '\n' || word === '\t') {
            fragment.appendChild(document.createTextNode(word));
          } else {
            const span = document.createElement('span');
            span.className = spanClass;
            span.style.setProperty('--split-index', String(splitIndex++));
            span.textContent = word;
            fragment.appendChild(span);
          }
        }
      }

      node.parentNode?.replaceChild(fragment, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        processNode(child);
      }
    }
  }

  processNode(el);
}

export function useSplitText(
  selector: string,
  options?: SplitTextOptions,
): void {
  const { type = 'chars', stagger = 0.05, duration = 0.6, y = 20 } = options ?? {};
  const observerMapRef = useRef<Map<HTMLElement, SplitTextObserverEntry>>(new Map());

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(selector);

    elements.forEach((el) => {
      splitTextElement(el, type);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target instanceof HTMLElement) {
              entry.target.classList.add('split-visible');
            }
          });
        },
        { threshold: 0.1 },
      );

      observer.observe(el);
      observerMapRef.current.set(el, { observer, element: el });
    });

    const style = document.createElement('style');
    style.id = 'split-text-dynamic-styles';
    style.textContent = `
      .split-char, .split-word { display: inline-block; opacity: 0; }
      .split-visible .split-char, .split-visible .split-word {
        animation: fadeUpIn ${duration}s ease forwards;
        animation-delay: calc(var(--split-index, 0) * ${stagger}s);
      }
      @keyframes fadeUpIn {
        from { opacity: 0; transform: translateY(${y}px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      observerMapRef.current.forEach(({ observer, element }) => {
        observer.unobserve(element);
        observer.disconnect();
      });
      observerMapRef.current.clear();
      const existingStyle = document.getElementById('split-text-dynamic-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [selector, type, stagger, duration, y]);
}
