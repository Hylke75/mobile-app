import ActivityKit
import AlarmKit
import SwiftUI
import WidgetKit

@main
struct MoooveAlarmBundle: WidgetBundle {
  var body: some Widget {
    AlarmLiveActivity()
  }
}

// Exact hetzelfde type als in react-native-alarm-scheduler (AlarmSchedulerAlarmKitSupport.swift):
// iOS koppelt de Live Activity van een alarm aan AlarmAttributes<AlarmSchedulerMetadata>.
struct AlarmSchedulerMetadata: AlarmMetadata {
  let alarmId: String
  let title: String
  let values: [String: AlarmSchedulerMetadataValue]
}

enum AlarmSchedulerMetadataValue: Codable, Hashable, Sendable {
  case string(String)
  case number(Double)
  case bool(Bool)

  init(from decoder: Decoder) throws {
    let container = try decoder.singleValueContainer()
    if let value = try? container.decode(Bool.self) {
      self = .bool(value)
    } else if let value = try? container.decode(Double.self) {
      self = .number(value)
    } else {
      self = .string(try container.decode(String.self))
    }
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    switch self {
    case .string(let value):
      try container.encode(value)
    case .number(let value):
      try container.encode(value)
    case .bool(let value):
      try container.encode(value)
    }
  }
}

struct AlarmLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: AlarmAttributes<AlarmSchedulerMetadata>.self) { context in
      HStack(spacing: 12) {
        Image(systemName: "alarm.fill")
          .font(.title2)
          .foregroundStyle(context.attributes.tintColor)
        VStack(alignment: .leading, spacing: 2) {
          Text(title(context.attributes))
            .font(.headline)
          AlarmStateText(state: context.state)
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
        Spacer()
      }
      .padding()
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(systemName: "alarm.fill")
            .foregroundStyle(context.attributes.tintColor)
        }
        DynamicIslandExpandedRegion(.center) {
          Text(title(context.attributes))
            .font(.headline)
        }
        DynamicIslandExpandedRegion(.bottom) {
          AlarmStateText(state: context.state)
        }
      } compactLeading: {
        Image(systemName: "alarm.fill")
          .foregroundStyle(context.attributes.tintColor)
      } compactTrailing: {
        AlarmStateText(state: context.state)
          .frame(maxWidth: 52)
      } minimal: {
        Image(systemName: "alarm.fill")
          .foregroundStyle(context.attributes.tintColor)
      }
    }
  }

  private func title(_ attributes: AlarmAttributes<AlarmSchedulerMetadata>) -> String {
    let title = attributes.metadata?.title ?? ""
    return title.isEmpty ? "Mooove" : title
  }
}

struct AlarmStateText: View {
  let state: AlarmPresentationState

  var body: some View {
    switch state.mode {
    case .countdown(let countdown):
      Text(countdown.fireDate, style: .timer)
        .monospacedDigit()
    default:
      Image(systemName: "figure.strengthtraining.functional")
    }
  }
}
