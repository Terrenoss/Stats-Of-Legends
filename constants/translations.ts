import { Language } from '../types';
import { FR } from './locales/fr';
import { EN } from './locales/en';
import { ES } from './locales/es';
import { KR } from './locales/kr';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
    FR,
    EN,
    ES,
    KR
};
