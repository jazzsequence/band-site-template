/** @deprecated Install `@p1/divider` from the P1 component library instead. Kept so existing pages still render. */
export const dividerBlock = {
  label: "Divider",
  fields: {},
  defaultProps: {},
  render: () => (
    <div className="px-16 py-4">
      <hr className="m-0 border-0 border-t border-neutral-300" />
    </div>
  ),
};
