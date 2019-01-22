'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});


exports.builder = ({docs, writeFile, globals, fileTemplate, loadTemplate}) => {
    const fileName = 'todos.html';
    const tagsWithTodo = docs.filter(tag => tag.todo);
    loadTemplate("todos.xml");  // Overwrite previously loaded to ensure this is active.
    const content = fileTemplate("todos", ["docs", "doc"])(tagsWithTodo, {});
    writeFile(fileName, content);
}
