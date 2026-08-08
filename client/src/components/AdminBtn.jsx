/**
 * Compact icon+label button for admin toolbars (role changes, resource
 * CRUD, exports, etc.) — visually distinct from the app's main .btn pill
 * CTAs on purpose, so admin screens read as a tool, not a marketing page.
 *
 * variant: 'primary' | 'secondary' | 'danger' | 'danger-outline'
 * icon: any lucide-react icon component, e.g. <AdminBtn icon={Plus}>New</AdminBtn>
 */
export function AdminBtn({ variant = 'secondary', icon: Icon, className = '', children, ...props }) {
  return (
    <button className={`abtn abtn-${variant} ${className}`.trim()} {...props}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}
