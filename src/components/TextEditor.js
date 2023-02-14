import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEditor, Editor, Range, Text, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, useFocused, useSlate, withReact } from 'slate-react';

import { Button, Menu, Portal } from '.';

const TextEditor = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  return (
    <Slate editor={editor} value={initialValue}>
      <CommentDialog />
      <Editable
        renderLeaf={(props) => <Leaf {...props} />}
        placeholder="Enter some text..."
        onDOMBeforeInput={(event) => {
          switch (event.inputType) {
            case "formatBold":
              event.preventDefault();
              return toggleFormat(editor, "bold");
            case "formatItalic":
              event.preventDefault();
              return toggleFormat(editor, "italic");
            case "formatUnderline":
              event.preventDefault();
              return toggleFormat(editor, "underlined");
            case "formatComment":
              event.preventDefault();
              return toggleFormat(editor, "comment", { isVoid: true });
          }
        }}
      />
    </Slate>
  );
};

const toggleFormat = (editor, format, data) => {
  const isActive = isFormatActive(editor, format);
  Transforms.setNodes(
    editor,
    { [format]: isActive ? null : true, ...data },
    { match: Text.isText, split: true }
  );
};

const isFormatActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => n[format] === true,
    mode: "all",
  });
  return !!match;
};

const getChildren = (editor, format) => {
  const [result] = Editor.nodes(editor, {
    match: (n) => n[format] === true,
    mode: "all",
  });

  return result;
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underlined) {
    children = <u>{children}</u>;
  }

  if (leaf.comment) {
    children = (
      <span {...attributes} data-comment={leaf.data} className="comment--text">
        {children}
      </span>
    );
  }

  return <span {...attributes}>{children}</span>;
};

const CommentDialog = () => {
  const ref = useRef();
  const editor = useSlate();
  const [value, setValue] = useState();
  const inFocus = useFocused();

  let children = getChildren(editor, "comment");
  let data = children ? children[0].data : null;

  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    if (!el) {
      return;
    }

    if (!selection) {
      el.removeAttribute("style");
      return;
    }

    const domSelection = window.getSelection();

    /**
     * if the parant of the selected text is `comment`, show the dialog
     */
    if (domSelection.extentNode?.parentNode?.parentNode?.dataset?.comment) {
      el.style.opacity = "1";
      return;
    }

    /**
     * if the selected text is empty &
     * the parant of the selected text is not a `comment`, hide the dialog
     */
    if (
      Editor.string(editor, selection).trim() === "" &&
      !domSelection.extentNode?.parentNode?.parentNode?.dataset?.comment
    ) {
      el.removeAttribute("style");
      return;
    }

    /**
     * if Range is Collapsed, But
     * the parent of selected text is a `comment`, show the dialog
     */
    if (
      Range.isCollapsed(selection) &&
      domSelection.extentNode?.parentNode?.parentNode?.dataset?.comment
    ) {
      el.style.opacity = "1";
      return;
    }

    /**
     * if there is no selection OR there is no focus, And there is no Selection in the `Editor`, hide the dialog
     */
    if (
      (!selection || !inFocus) &&
      Editor.string(editor, selection).trim() === ""
    ) {
      el.removeAttribute("style");
      return;
    }

    el.style.opacity = "1";
  });

  useEffect(() => {
    if (children && children[0].data) {
      setValue(children[0].data);
    } else {
      setValue("");
    }
  }, [data]);

  return (
    <Portal>
      <Menu ref={ref} className="menu--wrapper">
        <input className='comment--input' value={value} onChange={(e) => setValue(e.target.value)} />
        <FormatButton format="comment" text="comment" value={value} />
      </Menu>
    </Portal>
  );
};

const FormatButton = ({ format, value }) => {
  const editor = useSlate();

  const modifyComment = (update) => {
    toggleFormat(editor, format, { data: value });
    if (update) {
      toggleFormat(editor, format, { data: value });
    }
  };

  let buttons;

  if (isFormatActive(editor, format)) {
    buttons = (
      <>
        <Button onClick={() => modifyComment(true)} className='comment--update-btn'>Update</Button>
        <Button
          className='comment--comment-cancel'
          onClick={() => modifyComment()}
        >
          Cancel
        </Button>
      </>
    );
  } else {
    buttons = <Button onClick={() => modifyComment()} className='comment--comment-btn'>Comment</Button>;
  }

  return <div className='buttons-wrapper'>{buttons}</div>;
};

const initialValue = [
  {
    type: "paragraph",
    children: [
      {
        text: "This example shows how you can make a hovering menu appear above your content, which you can use to make text ",
      },
      { text: "bold", bold: true },
      { text: ", " },
      { text: "italic", italic: true },
      { text: " " },
      {
        text: "or comment",
        comment: true,
        data: " comment text",
        isVoid: true,
      },
      { text: ", or anything else you might want to do!" },
    ],
  },
  {
    type: "paragraph",
    children: [
      { text: "Try it out yourself! Just " },
      { text: "select any piece of text and the menu will appear", bold: true },
      { text: "." },
    ],
  },
];

export default TextEditor;
