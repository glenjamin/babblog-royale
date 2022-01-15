declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "@babel/register" {
  function register(options: { presets: string[]; extensions: string[] }): void;

  export = register;
}
