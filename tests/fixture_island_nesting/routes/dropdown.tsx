import Dropdown, {
  DropdownHandle,
  DropdownMenu,
} from "../islands/Dropdown.tsx";

export default function Page() {
  return (
    <div>
      <h1>Dropdown</h1>
      <Dropdown>
        <DropdownHandle>Click me!</DropdownHandle>
        <DropdownMenu>
          <p class="result">Hello Menu!</p>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
