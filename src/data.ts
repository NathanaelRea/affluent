import { z } from "zod";

export const STATES = [
  "Pennsylvania",
  "California",
  "Illinois",
  "Texas",
  "Arizona",
  "Massachusetts",
  "Georgia",
  "Oregon",
  "Florida",
  "Colorado",
  "Washington",
  "New York",
] as const;
export type State = (typeof STATES)[number];
export const stateSchema = z.enum(STATES);

export const CITIES = [
  "Los Angeles",
  "San Francisco",
  "Portland",
  "Seattle",
  "Phoenix",
  "Denver",
  "Austin",
  "Dallas",
  "Miami",
  "Pittsburgh",
  "Philadelphia",
  "Boston",
  "New York City",
  "Atlanta",
  "Chicago",
  "Houston",
  "San Diego",
] as const;
export type City = (typeof CITIES)[number];
export const citySchema = z.enum(CITIES);

export const TAX_STATUS = ["Single", "Married", "Head of Household"] as const;
export const taxStatusSchema = z.enum(TAX_STATUS);

export type TaxStatus = z.infer<typeof taxStatusSchema>;
type Bracket = Record<number, number>;

type StatusBased<T> = Record<TaxStatus, T>;

export type Tax =
  | {
      type: "status-based";
      status: StatusBased<Tax>;
    }
  | {
      type: "bracket";
      brackets: Bracket;
    }
  | {
      type: "percentage";
      rate: number;
    }
  | {
      type: "flat";
      rate: number;
    }
  | undefined;

type RangeBased = {
  low: number;
  high: number;
};

export type FedTax = {
  standardDeduction: number;
  socialSecurity: number;
  medicare: number;
  hsaMaxContribution: {
    contribution: StatusBased<number>;
    catchupContribution: number;
  };
  rothIRAMaxContribution: {
    range: StatusBased<RangeBased>;
    limit: number;
    catchupContribution: number;
  };
  rates: Tax;
};

export type StateInfo = {
  abbreviation: string;
};
export const STATE_INFO: Record<State, StateInfo> = {
  Pennsylvania: {
    abbreviation: "PA",
  },
  California: {
    abbreviation: "CA",
  },
  Illinois: {
    abbreviation: "IL",
  },
  Texas: {
    abbreviation: "TX",
  },
  Arizona: {
    abbreviation: "AZ",
  },
  Massachusetts: {
    abbreviation: "MA",
  },
  Georgia: {
    abbreviation: "GA",
  },
  Oregon: {
    abbreviation: "OR",
  },
  Washington: {
    abbreviation: "WA",
  },
  Colorado: {
    abbreviation: "CO",
  },
  Florida: {
    abbreviation: "FL",
  },
  "New York": {
    abbreviation: "NY",
  },
};

type CityInfo = {
  state: State;
};
export const CITY_INFO: Record<City, CityInfo> = {
  Austin: {
    state: "Texas",
  },
  Dallas: {
    state: "Texas",
  },
  "Los Angeles": {
    state: "California",
  },
  "San Francisco": {
    state: "California",
  },
  Portland: {
    state: "Oregon",
  },
  Phoenix: {
    state: "Arizona",
  },
  Seattle: {
    state: "Washington",
  },
  Miami: {
    state: "Florida",
  },
  Pittsburgh: {
    state: "Pennsylvania",
  },
  Philadelphia: {
    state: "Pennsylvania",
  },
  "New York City": {
    state: "New York",
  },
  Boston: {
    state: "Massachusetts",
  },
  Atlanta: {
    state: "Georgia",
  },
  Denver: {
    state: "Colorado",
  },
  Houston: {
    state: "Texas",
  },
  "San Diego": {
    state: "California",
  },
  Chicago: {
    state: "Illinois",
  },
};

export type IdName = {
  id: string;
  name: string;
};
export const CATEGORIES = [
  "Housing",
  "Transportation",
  "Grocery",
  "Utilities",
  "Healthcare",
  "Miscellaneous",
  "Non-Adjustable",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const categoryScheama = z.enum(CATEGORIES);

export type CostOfLivingCategory = Exclude<Category, "Non-Adjustable">;

export const AGES = ["< 50", ">= 50, < 55", ">= 55"] as const;
export type Age = (typeof AGES)[number];
export const agesSchema = z.enum(AGES);
