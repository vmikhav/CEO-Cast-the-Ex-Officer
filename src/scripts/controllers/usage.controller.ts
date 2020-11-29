
class UsageController {

  log(event: string, params: object|null = null) {
    console.log(event, params);
  }


  finishLevel() {

  }
}

export const usageController = new UsageController();
