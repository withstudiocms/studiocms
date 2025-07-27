import markdownIt from 'markdown-it';

const md = markdownIt();

export const parseMarkdown = (str: string) => md.render(str);
