import markdownIt from 'markdown-it';

const md = markdownIt({
	html: true,
	linkify: true,
});

export const parseMarkdown = (str: string) => md.render(str);
