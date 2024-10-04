export function OptOutLink(props: { href: string; partial: string }) {
  return (
    <div f-client-nav={false}>
      <a class="opt-out-link" href={props.href} f-partial={props.partial}>
        link
      </a>
    </div>
  );
}
