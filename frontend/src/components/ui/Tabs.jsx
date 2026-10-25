import { useRef } from 'react';

export default function Tabs({ tabs, value, onChange, label = 'Content tabs' }) {
  const refs = useRef([]);
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === value));

  function handleKeyDown(event, index) {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    refs.current[nextIndex]?.focus();
    onChange(tabs[nextIndex].id);
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => { refs.current[index] = node; }}
            id={`${tab.id}-tab`}
            role="tab"
            type="button"
            aria-selected={tab.id === value}
            aria-controls={`${tab.id}-panel`}
            tabIndex={tab.id === value ? 0 : -1}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${tab.id === value ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >{tab.label}</button>
        ))}
      </div>
      {tabs[activeIndex] && <div role="tabpanel" id={`${tabs[activeIndex].id}-panel`} aria-labelledby={`${tabs[activeIndex].id}-tab`} tabIndex={0} className="pt-5">{tabs[activeIndex].content}</div>}
    </div>
  );
}
