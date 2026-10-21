import {
  type InjectionKey,
  defineComponent,
  inject,
  provide,
  type PropType,
  type VNodeChild,
} from "vue";

interface CodeBlockContextType {
  code: string;
}

export const CodeBlockKey: InjectionKey<CodeBlockContextType> =
  Symbol("CodeBlock");

export const CodeBlockContext = {
  Provider: defineComponent({
    name: "CodeBlockContextProvider",
    props: {
      value: { type: Object as PropType<CodeBlockContextType>, required: true },
    },
    setup(props, { slots }) {
      provide(CodeBlockKey, props.value);
      return () => slots.default?.() as VNodeChild;
    },
  }),
};

export const useCodeBlockContext = () => inject(CodeBlockKey, { code: "" });
