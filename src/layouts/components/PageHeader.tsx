import { Link } from "react-router-dom";

type BreadcrumbItem = {
    label: string;
    to?: string;
};

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
};

function PageHeader({ title, subtitle, breadcrumbs = [] }: PageHeaderProps) {
    return (
        <section className="content-header">
            <div className="container-fluid">
                <div className="row mb-2">
                    <div className="col-sm-6">
                        <h1>{title}</h1>
                        {subtitle && <small>{subtitle}</small>}
                    </div>
                    <div className="col-sm-6">
                        <ol className="breadcrumb float-sm-end">
                            {breadcrumbs.map((breadcrumb, index) => (
                                <li
                                    key={`${breadcrumb.label}-${index}`}
                                    className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? "active" : ""}`}
                                >
                                    {breadcrumb.to && index !== breadcrumbs.length - 1 ? (
                                        <Link to={breadcrumb.to}>{breadcrumb.label}</Link>
                                    ) : (
                                        breadcrumb.label
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default PageHeader;
