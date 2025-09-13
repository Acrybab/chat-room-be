export type Profile = {
  name: {
    givenName: string;
    familyName: string;
  };
  emails?: Array<{ value: string; verified?: boolean }>;

  photos?: Array<{ value: string }>;
};
