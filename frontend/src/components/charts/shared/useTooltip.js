import { useCallback, useState } from 'react';

/**
 * Minimal tooltip state shared by all charts. `show` positions the tooltip at the given
 * client coordinates with arbitrary HTML content; `hide` dismisses it.
 *
 * @returns {{tooltip: {visible:boolean,x:number,y:number,content:string}, show: Function, hide: Function}}
 */
export function useTooltip() {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  const show = useCallback((event, content) => {
    setTooltip({ visible: true, x: event.clientX, y: event.clientY, content });
  }, []);

  const hide = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  return { tooltip, show, hide };
}

export default useTooltip;
