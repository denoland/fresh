export function OptOutPartialLink(props: { href: string; partial: string }) {
  return (
    <div f-client-nav={false}>
      <a class="update" href={props.href} f-partial={props.partial}>link</a>
    </div>
  );
}
