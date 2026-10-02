import { publicPath } from './public-path';

export type MethodField = {
  label: string;
  value: string;
};

export type MethodLink = {
  label: string;
  href: string;
};

export default function DataMethod({
  title = 'Datos y método',
  links,
  fields,
}: {
  title?: string;
  links: MethodLink[];
  fields: MethodField[];
}) {
  return (
    <details className="data-method">
      <summary>{title}</summary>
      <div className="data-method-body">
        <dl>
          {fields.map((field) => (
            <div key={`${field.label}-${field.value}`}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
        <div className="data-method-links">
          {links.map((link) => (
            <a key={`${link.label}-${link.href}`} href={publicPath(link.href)} target="_blank" rel="noreferrer">
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}
