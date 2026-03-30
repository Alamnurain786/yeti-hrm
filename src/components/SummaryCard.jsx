const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  cardClassName = "",
  titleClassName = "",
  valueClassName = "",
  iconClassName = "",
  iconContainerClassName = "",
  iconSize = 24,
  footer,
}) => {
  const containerClassName = ["rounded-2xl p-6 border", cardClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between mb-2">
        <span
          className={["text-sm font-medium text-slate-600", titleClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {title}
        </span>
        {Icon ? (
          iconContainerClassName ? (
            <div className={iconContainerClassName}>
              <Icon className={iconClassName} size={iconSize} />
            </div>
          ) : (
            <Icon className={iconClassName} size={iconSize} />
          )
        ) : null}
      </div>
      <h3
        className={["text-3xl font-bold text-slate-800", valueClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </h3>
      {subtitle ? (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      ) : null}
      {footer ? <div className="mt-1">{footer}</div> : null}
    </div>
  );
};

export default SummaryCard;
