import { css } from '@emotion/css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEditor, Editor, Element, Path, Range, Text, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, useFocused, useSlate, withReact } from 'slate-react';

import { Button, Icon, Menu, Portal } from '.';

// const schema = {
//   document: {
//     nodes: [{types: ['paragraph']}]
//   },
//   blocks: {
//     // paragraph: {
//     //   nodes: [{ objects: ['text'] }],
//     // },
//   },
//   inline: {
//     paragraph : {
//       isVoid: true,
//       nodes: [{ objects: ['text'] }],
//       data: {
//         comment :
//       }
//     }
//   }
// }

const HoveringMenuExample = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderElement = useCallback((props) => {
    console.log(props);
    switch (props.element.type) {
      case "paragraph":
        return <p {...props.attributes}></p>;
      case "code":
        //    return <CodeElement {...props} />
        //  default:
        return <span {...props.attributes}>a</span>;
    }
  }, []);

  return (
    <Slate editor={editor} value={initialValue}>
      <HoveringToolbar />
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
              console.log(event);
              return toggleFormat(editor, "comment");
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

const createLinkNode = (comment, text) => ({
  type: "comment",
  comment,
  children: [{ text }],
});

const removeLink = (editor, opts = {}) => {
  Transforms.unwrapNodes(editor, {
    ...opts,
    match: (n) =>
      !Editor.isEditor(n) && Element.isElement(n) && n.type === "comment",
  });
};

const createParagraphNode = (children = [{ text: "" }]) => ({
  type: "paragraph",
  children,
});

const insertLink = (editor, url) => {
  if (!url) return;

  const { selection } = editor;
  const link = createLinkNode(url, "New Link");

  ReactEditor.focus(editor);

  if (!!selection) {
    const [parentNode, parentPath] = Editor.parent(
      editor,
      selection.focus?.path
    );

    // Remove the Link node if we're inserting a new link node inside of another
    // link.
    if (parentNode.type === "link") {
      removeLink(editor);
    }

    if (editor.isVoid(parentNode)) {
      // Insert the new link after the void node
      Transforms.insertNodes(editor, createParagraphNode([link]), {
        at: Path.next(parentPath),
        select: true,
      });
    } else if (Range.isCollapsed(selection)) {
      // Insert the new link in our last known location
      Transforms.insertNodes(editor, link, { select: true });
    } else {
      // Wrap the currently selected range of text into a Link
      Transforms.wrapNodes(editor, link, { split: true });
      // Remove the highlight and move the cursor to the end of the highlight
      Transforms.collapse(editor, { edge: "end" });
    }
  } else {
    // Insert the new link node at the bottom of the Editor when selection
    // is falsey
    Transforms.insertNodes(editor, createParagraphNode([link]));
  }
};

const Leaf = ({ attributes, children, leaf, node }) => {
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
      <span
        data-comment={leaf.data}
        className={css`
          background: green;
          color: white;
        `}
      >
        {children}
      </span>
    );
  }

  return <span {...attributes}>{children}</span>;
};

const HoveringToolbar = () => {
  const ref = useRef();
  const editor = useSlate();
  const [value, setValue] = useState();
  const inFocus = useFocused();
  
  let children = getChildren(editor, "comment")
  let data = children ? children[0].data : null;
  
  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    if (!el) {
      return;
    }

    if (
      !selection ||
      !inFocus ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ""
    ) {
      // el.removeAttribute('style')
      return;
    }

    const domSelection = window.getSelection();
    if (!domSelection) {
      return;
    }
    // const domRange = domSelection.getRangeAt(0)
    // const rect = domRange.getBoundingClientRect()

    el.style.opacity = "1";
    // el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
    // el.style.left = `${rect.left +
    //   window.pageXOffset -
    //   el.offsetWidth / 2 +
    //   rect.width / 2}px`
  });

  useEffect(() => {
    if (children && children[0].data) {
      setValue(children[0].data);
    }else {
      setValue('')
    }
  }, [data]);

  return (
    <Portal>
      <Menu
        ref={ref}
        className={css`
          padding: 8px 7px 6px;
          position: absolute;
          width: 300px;
          z-index: 1;
          right: 0;
          bottom: 0;
          margin-top: -6px;
          opacity: 0;
          background-color: #222;
          border-radius: 4px;
          transition: opacity 0.75s;
        `}
        onMouseDown={(e) => {
          // prevent toolbar from taking focus away from editor
          // TODO: remove e.preventDefault()
          // e.preventDefault()
        }}
      >
        <input value={value} onChange={(e) => setValue(e.target.value)} />
        <FormatButton format="comment" text="comment" value={value} />
      </Menu>
    </Portal>
  );
};

const FormatButton = ({ format, icon, text, value }) => {
  const editor = useSlate();
  return (
    <div>
      {isFormatActive(editor, format) ? (
        <div>
      <Button
        reversed
        active={true}
        onClick={() => {
          toggleFormat(editor, format, { data: value });
          toggleFormat(editor, format, { data: value });
        }}
      >
        Update
        {icon ? <Icon>{icon}</Icon> : null}
      </Button>
      <Button
      className={css`margin:0 10px;`}
      reversed
      active={true}
      onClick={() => {
        toggleFormat(editor, format, { data: value });
      }}
      >
        Cancel
      </Button>
      </div>
      ): (
        <Button>
          <Button
        reversed
        active={true}
        onClick={() => {
          toggleFormat(editor, format, { data: value });
        }}
      >
        Comment
        {icon ? <Icon>{icon}</Icon> : null}
      </Button>
        </Button>
      )}
      {/* <Button
      className={css`margin:0 10px;`}
      reversed
      active={true}
      onClick={() => {
          toggleFormat(editor, format, { data: value });
        }}>
        Cancel
      </Button> */}
    </div>
  );
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

export default HoveringMenuExample;
