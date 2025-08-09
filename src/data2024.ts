import type { City, CostOfLivingCategory, FedLimits, State, Tax } from "./data";

export const COST_OF_LIVING: Record<
  City,
  Record<CostOfLivingCategory, number>
> = {
  "San Francisco": {
    Housing: 274.9,
    Transportation: 147.1,
    Miscellaneous: 125,
  },
  "Los Angeles": {
    Housing: 233.3,
    Transportation: 142.6,
    Miscellaneous: 110,
  },
  Philadelphia: {
    Housing: 97.4,
    Transportation: 108.7,
    Miscellaneous: 100,
  },
  Pittsburgh: {
    Housing: 94.9,
    Transportation: 110,
    Miscellaneous: 100,
  },
  Chicago: {
    Housing: 139,
    Transportation: 99.5,
    Miscellaneous: 100,
  },
  Houston: {
    Housing: 80.6,
    Transportation: 92.7,
    Miscellaneous: 100,
  },
  Phoenix: {
    Housing: 113.5,
    Transportation: 99.8,
    Miscellaneous: 100,
  },
  "San Diego": {
    Housing: 210.9,
    Transportation: 142.9,
    Miscellaneous: 110,
  },
  Dallas: {
    Housing: 97.3,
    Transportation: 88.8,
    Miscellaneous: 105,
  },
  Austin: {
    Housing: 105.2,
    Transportation: 93.9,
    Miscellaneous: 95,
  },
  Boston: {
    Housing: 212.8,
    Transportation: 113.8,
    Miscellaneous: 120,
  },
  Atlanta: {
    Housing: 91.1,
    Transportation: 98.6,
    Miscellaneous: 100,
  },
  Portland: {
    Housing: 147.4,
    Transportation: 133.3,
    Miscellaneous: 105,
  },
  Seattle: {
    Housing: 209.2,
    Transportation: 130.1,
    Miscellaneous: 115,
  },
  Denver: {
    Housing: 124.4,
    Transportation: 91.6,
    Miscellaneous: 100,
  },
  Miami: {
    Housing: 153.3,
    Transportation: 103.9,
    Miscellaneous: 105,
  },
  "New York City": {
    Housing: 485.3,
    Transportation: 110.5,
    Miscellaneous: 125,
  },
};

export const FED_LIMITS: FedLimits = {
  standardDeduction: 12_550,
  socialSecurity: 0.062,
  medicare: 0.0145,
  rates: {
    type: "status-based",
    status: {
      Single: {
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
      Married: {
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
      "Head of Household": {
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

type StateTaxes = Record<State, Tax>;
export const STATE_TAX: StateTaxes = {
  Pennsylvania: {
    type: "percentage",
    rate: 0.0307,
  },
  California: {
    type: "status-based",
    status: {
      Single: {
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
      Married: {
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
      "Head of Household": {
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
  Illinois: { type: "percentage", rate: 0.0495 },
  Texas: undefined,
  Arizona: { type: "percentage", rate: 0.025 },
  Massachusetts: { type: "percentage", rate: 0.05 },
  Georgia: {
    type: "status-based",
    status: {
      Single: {
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
      Married: {
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
      "Head of Household": {
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
  Oregon: {
    type: "status-based",
    status: {
      Single: {
        type: "bracket",
        brackets: {
          3_750: 0.0475,
          9_450: 0.0675,
          125_000: 0.0876,
          Infinity: 0.099,
        },
      },
      "Head of Household": {
        type: "bracket",
        brackets: {
          3_750: 0.0475,
          9_450: 0.0675,
          125_000: 0.0876,
          Infinity: 0.099,
        },
      },
      Married: {
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
  Washington: undefined,
  Colorado: { type: "percentage", rate: 0.0425 },
  Florida: undefined,
  "New York": {
    type: "status-based",
    status: {
      Single: {
        type: "bracket",
        brackets: {
          8_500: 0.04,
          11_700: 0.045,
          13_900: 0.0525,
          80_650: 0.055,
          215_400: 0.06,
          1_077_550: 0.0685,
          5_000_000: 0.0965,
          25_000_000: 0.103,
          Infinity: 0.109,
        },
      },
      Married: {
        type: "bracket",
        brackets: {
          17_150: 0.04,
          23_600: 0.045,
          27_900: 0.0525,
          161_550: 0.055,
          323_200: 0.06,
          2_155_350: 0.0685,
          5_000_000: 0.0965,
          25_000_000: 0.103,
          Infinity: 0.109,
        },
      },
      "Head of Household": {
        type: "bracket",
        brackets: {
          12_800: 0.04,
          17_650: 0.045,
          20_900: 0.0525,
          107_650: 0.055,
          269_300: 0.06,
          1_616_450: 0.0685,
          5_000_000: 0.0965,
          25_000_000: 0.103,
          Infinity: 0.109,
        },
      },
    },
  },
};

export const CITY_TAX: Record<City, Tax> = {
  Philadelphia: {
    type: "percentage",
    rate: 0.0375,
  },
  Pittsburgh: {
    type: "percentage",
    rate: 0.03,
  },
  Portland: {
    type: "status-based",
    status: {
      Single: {
        type: "bracket",
        brackets: { 125_000: 0.01 },
      },
      "Head of Household": {
        type: "bracket",
        brackets: { 250_000: 0.01 },
      },
      Married: {
        type: "bracket",
        brackets: { 250_000: 0.01 },
      },
    },
  },
  Denver: { type: "flat", rate: 5.75 * 12 },
  "New York City": {
    type: "status-based",
    status: {
      Single: {
        type: "bracket",
        brackets: {
          12_000: 0.0378,
          25_000: 0.03762,
          50_000: 0.03819,
          Infinity: 0.03876,
        },
      },
      Married: {
        type: "bracket",
        brackets: {
          21_600: 0.0378,
          45_000: 0.03762,
          90_000: 0.03819,
          Infinity: 0.03876,
        },
      },
      "Head of Household": {
        type: "bracket",
        brackets: {
          21_600: 0.0378,
          45_000: 0.03762,
          90_000: 0.03819,
          Infinity: 0.03876,
        },
      },
    },
  },
  "San Francisco": undefined,
  "Los Angeles": undefined,
  Chicago: undefined,
  Houston: undefined,
  Phoenix: undefined,
  "San Diego": undefined,
  Dallas: undefined,
  Austin: undefined,
  Boston: undefined,
  Atlanta: undefined,
  Seattle: undefined,
  Miami: undefined,
};

// Social Security assumptions for 2024
export const SSA_2024 = {
  fullRetirementAge: 67,
  taxableWageBase: 168_600,
  bendPoint1Monthly: 1_174,
  bendPoint2Monthly: 7_078,
} as const;
