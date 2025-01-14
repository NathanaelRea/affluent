export default function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="col-span-2 text-[0.8rem] font-medium text-destructive">
      {message}
    </p>
  );
}
