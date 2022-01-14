
import React, { useRef, useState } from 'react';
import { _t } from '../../../languageHandler';

import { Key } from "../../../Keyboard";
import Field from "../elements/Field";
import AccessibleButton from "../elements/AccessibleButton";
import { RovingAccessibleButton, useRovingTabIndex } from "../../../accessibility/RovingTabIndex";

// via https://itnext.io/reusing-the-ref-from-forwardref-with-react-hooks-4ce9df693dd
function useCombinedRefs(...refs) {
    const targetRef = React.useRef()
  
    React.useEffect(() => {
      refs.forEach(ref => {
        if (!ref) return
  
        if (typeof ref === 'function') {
          ref(targetRef.current)
        } else {
          ref.current = targetRef.current
        }
      })
    }, [refs])
  
    return targetRef
  }

interface CustomInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onInput'> {
  onChange?: (event: Event) => void;
  onInput?: (event: Event) => void;
}
/**
* This component restores the native 'onChange' and 'onInput' behavior of
* JavaScript. via https://stackoverflow.com/a/62383569/796832 and
* https://github.com/facebook/react/issues/9657#issuecomment-643970199
*
* See:
* - https://reactjs.org/docs/dom-elements.html#onchange
* - https://github.com/facebook/react/issues/3964
* - https://github.com/facebook/react/issues/9657
* - https://github.com/facebook/react/issues/14857
*
* We use this for the <input type="date"> date picker so we can distinguish
* from a final date picker selection vs navigating the months in the date
* picker which trigger an `input`(and `onChange` in React).
*/
const CustomInput = React.forwardRef((props: CustomInputProps, ref) => {
    const registerCallbacks = (input: HTMLInputElement | null) => {
        if (input) {
            input.onchange = props.onChange;
            input.oninput = props.onInput;
        }
    };

    return <input
        ref={useCombinedRefs(registerCallbacks, ref)}
        {...props}
        // These are just here so we don't get a read-only input warning from React
        onChange={() => {}}
        onInput={() => {}}
    />;
});


interface IProps {
  ts: number;
  onDatePicked?: (dateString: string) => void;
}

const JumpToDatePicker: React.FC<IProps> = ({ ts, onDatePicked }: IProps) => {
    const date = new Date(ts);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    const dateDefaultValue = `${year}-${month}-${day}`;

    const [dateValue, setDateValue] = useState(dateDefaultValue);
    // Whether or not to automatically navigate to the given date after someone
    // selects a day in the date picker. We want to disable this after someone
    // starts manually typing in the input instead of picking.
    const [navigateOnDatePickerSelection, setNavigateOnDatePickerSelection] = useState(true);

    // Since we're using CustomInput with native JavaScript behavior, this
    // tracks the date value changes as they come in.
    const onDateValueInput = (e: Event): void => {
        console.log('onDateValueInput')
        setDateValue((e.target as HTMLInputElement).value);
    };

    // Since we're using CustomInput with native JavaScript behavior, the change
    // event listener will trigger when a date is picked from the date picker
    // or when the text is fully filled out. In order to not trigger early
    // as someone is typing out a date, we need to disable when we see keydowns.
    const onDateValueChange = (e: Event): void => {
        console.log('onDateValueChange')
        setDateValue((e.target as HTMLInputElement).value);

        // Don't auto navigate if they were manually typing out a date
        if(navigateOnDatePickerSelection) {
            onDatePicked(dateValue);
        }
    };

    // const inputRef = React.useRef<HTMLInputElement>(null);
    // const registerInputCallbacks = (input: HTMLInputElement | null) => {
    //     inputRef.current = input;

    //     if (input) {
    //         input.onchange = onDateValueChange;
    //         input.oninput = onDateValueInput;
    //     }
    // };

    const [onFocus, isActive, ref] = useRovingTabIndex<HTMLInputElement>();

    const onDateInputKeyDown = (e: React.KeyboardEvent): void => {
        // // Don't interfere with input default keydown behaviour. For example,
        // // without this, when pressing "Space" while in the input, it would
        // // scroll down the timeline.
        // e.stopPropagation();

        // // Ignore the tab key which is probably just navigating focus around
        // // with the keyboard
        // if(e.key === "Tab") {
        //     return;
        // }

        // Go and navigate if they submitted
        if(e.key === "Enter") {
            onDatePicked(dateValue);
            return;
        }

        // When we see someone manually typing out a date, disable the auto
        // submit on change.
        setNavigateOnDatePickerSelection(false);
    };

    const onFormKeyDown = (e: React.KeyboardEvent) => {
        // // Stop the ContextMenu from closing when we first tab from the form to
        // // the datePicker.
        // if(e.target === e.currentTarget && e.key === Key.TAB) {
        //     e.stopPropagation();
        // }
    }

    const onGoKeyDown = (e: React.KeyboardEvent) => {
        // // Stop the ContextMenu from closing when we tab backwards to the
        // // datePicker from the "Go" button
        // //
        // // If they tab forwards off the end of the ContextMenu, we want to close
        // // the ContextMenu which will put the focus back where we were before
        // // opening the ContextMenu.
        // if (e.key === Key.TAB && e.shiftKey) {
        //     e.stopPropagation();
        // }
    }

    const onJumpToDateSubmit = (): void => {
        onDatePicked(dateValue);
    }

    return (
        <form
            className="mx_JumpToDatePicker_form"
            onSubmit={onJumpToDateSubmit}
            onKeyDown={onFormKeyDown}
            // onFocus={onFocus}
            // ref={ref}
            // tabIndex={isActive ? 0 : -1}
        >
            <span className="mx_JumpToDatePicker_label">Jump to date</span>
            <CustomInput
                //element={CustomInput}
                type="date"
                onChange={onDateValueChange}
                onInput={onDateValueInput}
                onKeyDown={onDateInputKeyDown}
                value={dateValue}
                className="mx_JumpToDatePicker_datePicker"
                //label={_t("Pick a date to jump to")}
                onFocus={onFocus}
                ref={ref}
                tabIndex={isActive ? 0 : -1}
            />
            <RovingAccessibleButton
                kind="primary"
                className="mx_JumpToDatePicker_submitButton"
                onClick={onJumpToDateSubmit}
                onKeyDown={onGoKeyDown}
            >
                { _t("Go") }
            </RovingAccessibleButton>
        </form>
    )
};

export default JumpToDatePicker;
