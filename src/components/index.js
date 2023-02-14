import { css, cx } from '@emotion/css';
import React, { PropsWithChildren, Ref, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const Button = React.forwardRef(
  (
    {
      className,
      active = true,
      reversed = true,
      ...props
    },
    ref
  ) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          cursor: pointer;
          color: ${reversed
            ? active
              ? 'white'
              : '#aaa'
            : active
            ? 'black'
            : '#ccc'};
        `
      )}
    />
  )
)

export const Menu = React.forwardRef(
  (
    { className, ...props },
    ref
  ) => (
    <div
      {...props}
      data-test-id="menu"
      ref={ref}
      className={cx(
        className,
        css`
          & > * {
            display: inline-block;
          }

          & > * + * {
            margin-left: 15px;
          }
        `
      )}
    />
  )
)


export const Portal = (props) => {
    const ref = useRef(null)
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
      ref.current = document.querySelector("#portal")
      setMounted(true)
    }, [])
  
    return (mounted && ref.current) ? createPortal(<div>{props.children}</div>, ref.current) : null
}


export const Toolbar = React.forwardRef(
  (
    { className, ...props },
    ref
  ) => (
    <Menu
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          position: relative;
          padding: 1px 18px 17px;
          margin: 0 -20px;
          border-bottom: 2px solid #eee;
          margin-bottom: 20px;
        `
      )}
    />
  )
)