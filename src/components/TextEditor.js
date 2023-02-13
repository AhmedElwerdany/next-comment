import { css } from '@emotion/css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEditor, Editor, Range, Text, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, useFocused, useSlate, withReact } from 'slate-react';

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
      <span
        {...attributes}
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

    if (domSelection.extentNode?.parentNode?.parentNode?.dataset?.comment) {
      el.style.opacity = '1'
      return
    }
    
    // if (
    //   Editor.string(editor, selection).trim() === "" &&
    //   !domSelection.extentNode?.parentNode?.parentNode?.dataset?.comment
    // ) {
    //   el.removeAttribute("style");
    //   debugger;
    //   return;
    // }

    // if (!inFocus && domSelection.extentNode?.parentNode?.parentNode?.dataset?.comment) {
    //   el.style.opacity = '1'
    //   return
    // }

    if (
      (!selection ||
      !inFocus ||
      Range.isCollapsed(selection))
      && domSelection.extentNode?.parentNode?.parentNode?.dataset?.comment
      //  || Editor.string(editor, selection) === ""
    ) {
      el.style.opacity = '1'
      debugger;
      return;
    }

    el.removeAttribute('style')

    // if (!domSelection) {
    //   el.removeAttribute("style");
    //   debugger;
    //   return;
    // }

    console.log(domSelection);

    // if (domSelection.type == "Caret") {
    //   debugger;
    //   el.removeAttribute("style");
    //   return;
    // }
    // const domRange = domSelection.getRangeAt(0)
    // const rect = domRange.getBoundingClientRect()

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

const FormatButton = ({ format, icon, value }) => {
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
          </Button>
          <Button
            className={css`
              margin: 0 10px;
            `}
            reversed
            active={true}
            onClick={() => {
              toggleFormat(editor, format, { data: value });
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
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
      { text: " " },
      { text: "or comment", comment: true, data: " comment text" },
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
