import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const marked = new Marked(
	markedHighlight({
		emptyLangClass: 'hljs',
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	})
);

marked.setOptions({
	gfm: true,
	breaks: false
});

/**
 * Parse markdown content to HTML
 * @param {string} content
 * @returns {string}
 */
export function parseMarkdown(content) {
	return /** @type {string} */ (marked.parse(content));
}
