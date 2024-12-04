import { z } from "zod";

export const TAX_STATUS = ["single", "married", "headOfHousehold"] as const;
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
  | {
      type: "none";
    };

type RangeBased = {
  low: number;
  high: number;
};

type FedTax = {
  standardDeduction: number;
  socialSecurity: number;
  medicare: number;
  hsaMaxContribution: StatusBased<number>;
  rothIRAMaxContribution: {
    range: StatusBased<RangeBased>;
    limit: number;
    limit50: number;
  };
  rates: Tax;
};

export type IdName = {
  id: string;
  name: string;
};
export const categories: IdName[] = [
  { id: "1", name: "Housing" },
  { id: "2", name: "Transportation" },
  { id: "3", name: "Grocery" },
  { id: "4", name: "Utilities" },
  { id: "5", name: "Healthcare" },
  { id: "6", name: "Miscellaneous" },
];

export type City = {
  id: string;
  name: string;
  state: {
    id: string;
    abbreviation: string;
  };
  tax: Tax;
  costOfLiving: Record<string, number>;
};
export const cities: City[] = [
  {
    id: "1",
    name: "San Francisco",
    state: { id: "1", abbreviation: "CA" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 274.9,
      "2": 147.1,
      "3": 122.8,
      "4": 161.2,
      "5": 123.9,
      "6": 117.5,
    },
  },
  {
    id: "2",
    name: "Los Angeles",
    state: { id: "1", abbreviation: "CA" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 233.3,
      "2": 142.6,
      "3": 111.6,
      "4": 113.9,
      "5": 99.3,
      "6": 117.6,
    },
  },
  {
    id: "3",
    name: "Philadelphia",
    state: { id: "2", abbreviation: "PA" },
    tax: { type: "percentage", rate: 0.0375 },
    costOfLiving: {
      "1": 97.4,
      "2": 108.7,
      "3": 103.5,
      "4": 104.4,
      "5": 89.4,
      "6": 102.9,
    },
  },
  {
    id: "4",
    name: "Pittsburgh",
    state: { id: "2", abbreviation: "PA" },
    tax: { type: "percentage", rate: 0.03 },
    costOfLiving: {
      "1": 94.9,
      "2": 110,
      "3": 97.4,
      "4": 118.9,
      "5": 99.5,
      "6": 92.2,
    },
  },
  {
    id: "5",
    name: "Chicago",
    state: { id: "3", abbreviation: "IL" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 139,
      "2": 99.5,
      "3": 102.5,
      "4": 96.9,
      "5": 107.3,
      "6": 107.3,
    },
  },
  {
    id: "6",
    name: "Houston",
    state: { id: "4", abbreviation: "TX" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 80.6,
      "2": 92.7,
      "3": 99.5,
      "4": 93.8,
      "5": 92.8,
      "6": 102.9,
    },
  },
  {
    id: "7",
    name: "Phoenix",
    state: { id: "5", abbreviation: "AZ" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 113.5,
      "2": 99.8,
      "3": 103.1,
      "4": 101.2,
      "5": 87.7,
      "6": 101.7,
    },
  },
  {
    id: "8",
    name: "San Diego",
    state: { id: "1", abbreviation: "CA" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 210.9,
      "2": 142.9,
      "3": 112.8,
      "4": 127.5,
      "5": 98.8,
      "6": 112.9,
    },
  },
  {
    id: "9",
    name: "Dallas",
    state: { id: "4", abbreviation: "TX" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 97.3,
      "2": 88.8,
      "3": 98.6,
      "4": 112.9,
      "5": 99.7,
      "6": 107.6,
    },
  },
  {
    id: "10",
    name: "Austin",
    state: { id: "4", abbreviation: "TX" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 105.2,
      "2": 93.9,
      "3": 97.1,
      "4": 98.6,
      "5": 94.7,
      "6": 93.7,
    },
  },
  {
    id: "11",
    name: "Boston",
    state: { id: "6", abbreviation: "MA" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 212.8,
      "2": 113.8,
      "3": 104,
      "4": 149,
      "5": 123.6,
      "6": 116.1,
    },
  },
  {
    id: "12",
    name: "Atlanta",
    state: { id: "7", abbreviation: "GA" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 91.1,
      "2": 98.6,
      "3": 100.6,
      "4": 96.1,
      "5": 104.8,
      "6": 97.7,
    },
  },
  {
    id: "13",
    name: "Portland",
    state: { id: "8", abbreviation: "OR" },
    tax: {
      type: "status-based",
      status: {
        single: {
          type: "bracket",
          brackets: { 125_000: 0.01 },
        },
        headOfHousehold: {
          type: "bracket",
          brackets: { 250_000: 0.01 },
        },
        married: {
          type: "bracket",
          brackets: { 250_000: 0.01 },
        },
      },
    },
    costOfLiving: {
      "1": 147.4,
      "2": 133.3,
      "3": 109.8,
      "4": 85.6,
      "5": 117.7,
      "6": 103.6,
    },
  },
  {
    id: "14",
    name: "Seattle",
    state: { id: "9", abbreviation: "WA" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 209.2,
      "2": 130.1,
      "3": 112.5,
      "4": 102.6,
      "5": 127.4,
      "6": 120.6,
    },
  },
  {
    id: "15",
    name: "Denver",
    state: { id: "10", abbreviation: "CO" },
    tax: { type: "flat", rate: 5.75 * 12 },
    costOfLiving: {
      "1": 124.4,
      "2": 91.6,
      "3": 100.8,
      "4": 89.7,
      "5": 107,
      "6": 106.4,
    },
  },
  {
    id: "16",
    name: "Miami",
    state: { id: "11", abbreviation: "FL" },
    tax: { type: "none" },
    costOfLiving: {
      "1": 153.3,
      "2": 103.9,
      "3": 109,
      "4": 107.7,
      "5": 102.2,
      "6": 106.7,
    },
  },
];
export const cityMap = cities.reduce((acc, city) => {
  acc.set(city.id, city);
  return acc;
}, new Map<string, City>());

export type State = {
  id: string;
  name: string;
  abbreviation: string;
  tax: Tax;
};
export const states: State[] = [
  {
    id: "1",
    name: "Pennsylvania",
    abbreviation: "PA",
    tax: { type: "percentage", rate: 0.0307 },
  },
  {
    id: "2",
    name: "California",
    abbreviation: "CA",
    tax: {
      type: "status-based",
      status: {
        single: {
          type: "bracket",
          brackets: {
            10_756: 0.01,
            25_499: 0.02,
            40_245: 0.04,
            55_866: 0.06,
            70_606: 0.08,
            360_659: 0.093,
            432_787: 0.103,
            721_314: 0.113,
            Infinity: 0.123,
          },
        },
        married: {
          type: "bracket",
          brackets: {
            21_512: 0.01,
            50_998: 0.02,
            80_490: 0.04,
            111_732: 0.06,
            141_212: 0.08,
            721_318: 0.093,
            865_574: 0.103,
            1_442_628: 0.113,
            Infinity: 0.123,
          },
        },
        headOfHousehold: {
          type: "bracket",
          brackets: {
            21_527: 0.01,
            51_000: 0.02,
            65_744: 0.04,
            81_364: 0.06,
            96_107: 0.08,
            490_493: 0.093,
            588_593: 0.103,
            980_987: 0.113,
            Infinity: 0.123,
          },
        },
      },
    },
  },
  {
    id: "3",
    name: "Illinois",
    abbreviation: "IL",
    tax: { type: "percentage", rate: 0.0495 },
  },
  {
    id: "4",
    name: "Texas",
    abbreviation: "TX",
    tax: { type: "none" },
  },
  {
    id: "5",
    name: "Arizona",
    abbreviation: "AZ",
    tax: { type: "percentage", rate: 0.025 },
  },
  {
    id: "6",
    name: "Massachusetts",
    abbreviation: "MA",
    tax: { type: "percentage", rate: 0.05 },
  },
  {
    id: "7",
    name: "Georgia",
    abbreviation: "GA",
    tax: {
      type: "status-based",
      status: {
        single: {
          type: "bracket",
          brackets: {
            750: 0.01,
            2250: 0.02,
            3750: 0.03,
            5250: 0.04,
            7000: 0.05,
            Infinity: 0.0575,
          },
        },
        married: {
          type: "bracket",
          brackets: {
            1000: 0.01,
            3000: 0.02,
            5000: 0.03,
            7000: 0.04,
            10_000: 0.05,
            Infinity: 0.0575,
          },
        },
        headOfHousehold: {
          type: "bracket",
          brackets: {
            1000: 0.01,
            3000: 0.02,
            5000: 0.03,
            7000: 0.04,
            10_000: 0.05,
            Infinity: 0.0575,
          },
        },
      },
    },
  },
  {
    id: "8",
    name: "Oregon",
    abbreviation: "OR",
    tax: {
      type: "status-based",
      status: {
        single: {
          type: "bracket",
          brackets: {
            3_750: 0.0475,
            9_450: 0.0675,
            125_000: 0.0876,
            Infinity: 0.099,
          },
        },
        headOfHousehold: {
          type: "bracket",
          brackets: {
            3_750: 0.0475,
            9_450: 0.0675,
            125_000: 0.0876,
            Infinity: 0.099,
          },
        },
        married: {
          type: "bracket",
          brackets: {
            8_100: 0.0475,
            20_400: 0.0675,
            250_000: 0.0875,
            Infinity: 0.099,
          },
        },
      },
    },
  },
  {
    id: "9",
    name: "Washington",
    abbreviation: "WA",
    tax: { type: "none" },
  },
  {
    id: "10",
    name: "Colorado",
    abbreviation: "CO",
    tax: { type: "percentage", rate: 0.0425 },
  },
  {
    id: "11",
    name: "Florida",
    abbreviation: "FL",
    tax: { type: "none" },
  },
];
export const stateMap = states.reduce((acc, state) => {
  acc.set(state.id, state);
  return acc;
}, new Map<string, State>());

// 2024
export const FED_TAX: FedTax = {
  standardDeduction: 12_550,
  socialSecurity: 0.062,
  medicare: 0.0145,
  hsaMaxContribution: {
    single: 4_150,
    married: 8_300,
    headOfHousehold: 8_300,
  },
  rothIRAMaxContribution: {
    range: {
      single: { low: 146_000, high: 161_000 },
      married: { low: 230_000, high: 240_000 },
      headOfHousehold: { low: 146_000, high: 161_000 },
    },
    limit: 7_000,
    limit50: 8_000,
  },
  rates: {
    type: "status-based",
    status: {
      single: {
        type: "bracket",
        brackets: {
          11_600: 0.1,
          47_150: 0.12,
          100_525: 0.22,
          191_950: 0.24,
          243_725: 0.32,
          609_350: 0.35,
          Infinity: 0.37,
        },
      },
      married: {
        type: "bracket",
        brackets: {
          23_200: 0.1,
          94_300: 0.12,
          201_050: 0.22,
          383_900: 0.24,
          487_450: 0.32,
          731_200: 0.35,
          Infinity: 0.37,
        },
      },
      headOfHousehold: {
        type: "bracket",
        brackets: {
          16_550: 0.1,
          63_100: 0.12,
          100_500: 0.22,
          191_950: 0.24,
          243_700: 0.32,
          609_350: 0.35,
          Infinity: 0.37,
        },
      },
    },
  },
};
