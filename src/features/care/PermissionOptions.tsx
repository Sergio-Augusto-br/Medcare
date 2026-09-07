import type { Permission } from "@/types";
import { permissionOptions } from "./permissions";

export default function PermissionOptions({
  value,
  onChange,
  disabled = false,
}: {
  value: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="care-permissions">
      <legend>Permissões</legend>
      {permissionOptions.map((option) => (
        <label key={option.value}>
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...value, option.value]
                  : value.filter((permission) => permission !== option.value),
              )
            }
          />
          <span>
            <strong>{option.label}</strong>
            <small>{option.description}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
